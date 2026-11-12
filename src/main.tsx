import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider, theme } from 'antd';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LangProvider, useLang } from './i18n';
import { AuthProvider } from './lib/auth';
import 'antd/dist/reset.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

/** The themed ConfigProvider, with AntD's own furniture in the current language. */
function Themed({ children }: { children: React.ReactNode }) {
  const { antd } = useLang();
  return (
    <ConfigProvider
      locale={antd}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#c2410c',
          borderRadius: 8,
          // AntD's own stack, with Telugu ahead of the generic fallback.
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Noto Sans Telugu', sans-serif",
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LangProvider>
      <Themed>
        <AntApp>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </AuthProvider>
          </QueryClientProvider>
        </AntApp>
      </Themed>
    </LangProvider>
  </React.StrictMode>,
);
