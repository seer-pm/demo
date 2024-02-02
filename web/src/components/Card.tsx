export function Card({ children, title }): React.FC<{ title?: string }> {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        {title && <div className="card-title">{title}</div>}

        {children}
      </div>
    </div>
  );
}
