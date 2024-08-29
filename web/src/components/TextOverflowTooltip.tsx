function TextOverflowTooltip({ text, maxChar }: { text: string; maxChar: number; url?: string }) {
  if (text.length <= maxChar) {
    return <p>{text}</p>;
  }
  return (
    <div className="tooltip">
      <p className="tooltiptext !w-[400px] !left-[10%]">{text}</p>
      <p className="whitespace-nowrap">{text.slice(0, maxChar - 3)}...</p>
    </div>
  );
}

export default TextOverflowTooltip;
