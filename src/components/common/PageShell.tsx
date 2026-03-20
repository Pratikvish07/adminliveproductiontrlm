import React from 'react';

interface PageShellProps {
  kicker: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const PageShell: React.FC<PageShellProps> = ({ kicker, title, subtitle, children }) => {
  return (
    <section className="page-shell">
      <header className="page-header">
        <span className="page-kicker">{kicker}</span>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </header>
      <div className="page-stack">{children}</div>
    </section>
  );
};

export default PageShell;
