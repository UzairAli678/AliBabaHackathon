export default function ChatBubble({ message, isUser = false, emergencyDetected = false, timestamp }) {
  const bubbleClasses = isUser
    ? 'bg-primary text-white shadow-soft'
    : emergencyDetected
      ? 'border-rose-300 bg-rose-50 text-rose-950 shadow-card'
      : 'border-border bg-white text-heading shadow-card';

  return (
    <div className={`flex max-w-[82%] flex-col ${isUser ? 'self-end items-end' : 'self-start items-start'}`}>
      <div
        className={`rounded-[22px] border px-4 py-3 text-sm leading-7 sm:px-5 ${bubbleClasses} ${
          isUser ? 'rounded-tr-md' : 'rounded-tl-md'
        }`}
      >
        {message}
      </div>
      {timestamp ? <span className={`mt-1 text-xs text-muted ${isUser ? 'text-right' : 'text-left'}`}>{timestamp}</span> : null}
    </div>
  );
}
