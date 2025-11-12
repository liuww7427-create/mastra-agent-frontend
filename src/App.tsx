import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import './App.css';

const DASHBOARD_QUERY = gql`
  query Dashboard($profile: CareProfileInput!) {
    dailyTips(profile: $profile) {
      id
      title
      description
      category
    }
    carePlan(profile: $profile) {
      summary
      feedingFocus
      sleepFocus
      playFocus
      developmentFocus
      reminders
    }
  }
`;

const ASK_AGENT_MUTATION = gql`
  mutation AskAgent($input: AskAgentInput!) {
    askAgent(input: $input) {
      message
      highlights
    }
  }
`;

type BabyStage = 'NEWBORN' | 'INFANT' | 'TODDLER';

type CareProfileInput = {
  name: string;
  babyAgeWeeks: number;
  babyStage: BabyStage;
  focusAreas: string[];
};

type Tip = {
  id: string;
  title: string;
  description: string;
  category: string;
};

type CarePlan = {
  summary: string;
  feedingFocus: string;
  sleepFocus: string;
  playFocus: string;
  developmentFocus: string;
  reminders: string[];
};

type AgentAnswer = {
  message: string;
  highlights: string[];
};

const DEFAULT_PROFILE: CareProfileInput = {
  name: '豆豆',
  babyAgeWeeks: 20,
  babyStage: 'INFANT',
  focusAreas: ['sleep', 'play']
};

const STAGE_OPTIONS: Array<{ value: BabyStage; label: string }> = [
  { value: 'NEWBORN', label: '新生儿（0-2月）' },
  { value: 'INFANT', label: '婴儿（3-12月）' },
  { value: 'TODDLER', label: '幼儿（1-3岁）' }
];

const FOCUS_OPTIONS = [
  { value: 'feeding', label: '科学喂养' },
  { value: 'sleep', label: '睡眠节律' },
  { value: 'play', label: '亲子互动' },
  { value: 'soothing', label: '安抚技巧' },
  { value: 'language', label: '语言刺激' },
  { value: 'milestone', label: '成长里程碑' }
];

function App() {
  const [profile, setProfile] = useState<CareProfileInput>(DEFAULT_PROFILE);
  const [question, setQuestion] = useState('宝宝白天总是短睡，晚上也爱闹，怎么调整节奏？');
  const [agentAnswer, setAgentAnswer] = useState<AgentAnswer | null>(null);

  const queryVariables = useMemo(() => ({ profile }), [profile]);

  const { data, loading, refetch } = useQuery<{ dailyTips: Tip[]; carePlan: CarePlan }>(DASHBOARD_QUERY, {
    variables: queryVariables
  });

  const [askAgent, { loading: asking }] = useMutation<{ askAgent: AgentAnswer }>(ASK_AGENT_MUTATION);

  const handleProfileChange = <K extends keyof CareProfileInput>(field: K, value: CareProfileInput[K]) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFocusToggle = (value: string) => {
    setProfile((prev) => {
      const exists = prev.focusAreas.includes(value);
      return {
        ...prev,
        focusAreas: exists ? prev.focusAreas.filter((item) => item !== value) : [...prev.focusAreas, value]
      };
    });
  };

  const handleAskAgent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) {
      return;
    }

    try {
      const response = await askAgent({
        variables: { input: { question, profile } }
      });

      if (response.data?.askAgent) {
        setAgentAnswer(response.data.askAgent);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const tips: Tip[] = data?.dailyTips ?? [];
  const carePlan: CarePlan | undefined = data?.carePlan;

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Mastra · Baby Coach</p>
          <h1>宝宝成长指挥台</h1>
          <p className="muted">一站式掌握喂养节奏、睡眠安排与互动灵感，并随时向 AI 育儿教练提问。</p>
        </div>
        <button className="refresh" onClick={() => refetch()} disabled={loading}>
          {loading ? '加载中...' : '刷新建议'}
        </button>
      </header>

      <main className="grid">
        <section className="card">
          <div className="card-title">
            <h2>宝宝档案</h2>
            <p>切换关注点即可刷新每日贴士与计划</p>
          </div>
          <form className="profile-form" onSubmit={(e) => e.preventDefault()}>
            <label>
              宝宝昵称
              <input value={profile.name} onChange={(e) => handleProfileChange('name', e.target.value)} />
            </label>
            <label>
              宝宝周龄
              <input
                type="number"
                min={0}
                value={profile.babyAgeWeeks}
                onChange={(e) => handleProfileChange('babyAgeWeeks', Number(e.target.value))}
              />
            </label>
            <label>
              成长阶段
              <select
                value={profile.babyStage}
                onChange={(e) => handleProfileChange('babyStage', e.target.value as BabyStage)}
              >
                {STAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>想关注</legend>
              <div className="focus-grid">
                {FOCUS_OPTIONS.map((option) => (
                  <label key={option.value} className="checkbox">
                    <input
                      type="checkbox"
                      checked={profile.focusAreas.includes(option.value)}
                      onChange={() => handleFocusToggle(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </form>
        </section>

        <section className="card">
          <div className="card-title">
            <h2>今日贴士</h2>
            <p>基于阶段与关注点即时生成</p>
          </div>
          <div className="tips-list">
            {tips.map((tip) => (
              <article key={tip.id} className="tip-item">
                <p className="tip-category">#{tip.category}</p>
                <h3>{tip.title}</h3>
                <p>{tip.description}</p>
              </article>
            ))}
            {!loading && tips.length === 0 && <p className="muted">暂时没有贴士，可调整关注点再试试。</p>}
          </div>
        </section>

        <section className="card span-2">
          <div className="card-title">
            <h2>成长陪伴计划</h2>
            <p>结合阶段自动推演喂养、睡眠与互动重点</p>
          </div>
          {carePlan ? (
            <div className="care-plan">
              <p className="summary">{carePlan.summary}</p>
              <ul>
                <li>
                  <strong>喂养策略：</strong>
                  {carePlan.feedingFocus}
                </li>
                <li>
                  <strong>睡眠节律：</strong>
                  {carePlan.sleepFocus}
                </li>
                <li>
                  <strong>互动灵感：</strong>
                  {carePlan.playFocus}
                </li>
                <li>
                  <strong>发展观察：</strong>
                  {carePlan.developmentFocus}
                </li>
              </ul>
              <div className="reminders">
                <p>温柔提醒：</p>
                <div className="chips">
                  {carePlan.reminders.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="muted">正在生成照护计划...</p>
          )}
        </section>

        <section className="card span-2">
          <div className="card-title">
            <h2>向 AI 育儿教练提问</h2>
            <p>Mastra + OpenAI 实时解答喂养与互动难题</p>
          </div>
          <form className="ask-form" onSubmit={handleAskAgent}>
            <textarea
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="想问的内容，例如：宝宝趴着不到两分钟就哭怎么办？"
            />
            <button type="submit" disabled={asking}>
              {asking ? '正在连线教练...' : '发送问题'}
            </button>
          </form>
          <div className="agent-answer">
            {agentAnswer ? (
              <>
                <p className="muted">教练答复</p>
                <p>{agentAnswer.message}</p>
                {agentAnswer.highlights.length > 0 && (
                  <ul>
                    {agentAnswer.highlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p className="muted">提交问题后即可收到温柔且专业的陪伴建议。</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
