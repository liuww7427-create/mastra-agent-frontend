import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { ApolloProvider } from '@apollo/client/react';
import './index.css';
import App from './App.tsx';

console.log('main:', import.meta.env)
const graphqlEndpoint =
  import.meta.env.VITE_GRAPHQL_ENDPOINT ?? (import.meta.env.DEV ? 'http://localhost:4000/graphql111' : '/api/graphql');

const client = new ApolloClient({
  link: new HttpLink({
    uri: graphqlEndpoint
  }),
  cache: new InMemoryCache()
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </StrictMode>
);
