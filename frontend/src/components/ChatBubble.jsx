import { SparklesIcon, UserIcon } from '@heroicons/react/24/solid';

export default function ChatBubble({ message, isUser = false, emergencyDetected = false, timestamp }) {
  const bubbleClasses = isUser
    ? 'bg-primary text-white shadow-soft'
    : emergencyDetected
      ? 'border-rose-300 bg-rose-50 text-rose-950 shadow-card'
      : 'border-border bg-white text-heading shadow-card';

  return (
    <div className={`flex w-full gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isUser ? 'bg-slate-200 text-slate-600' : 'bg-primary text-white shadow-soft'}`}>
        {isUser ? <UserIcon className="h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
      </div>
      <div className={`flex max-w-[78%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`mb-1 text-xs font-medium ${isUser ? 'text-muted' : 'text-primary'}`}>
          {isUser ? 'You' : 'CareLedger AI'}
        </div>
        <div className={`rounded-[22px] border px-4 py-3 text-sm leading-7 sm:px-5 ${bubbleClasses} ${isUser ? 'rounded-tr-md' : 'rounded-tl-md'}`}>
          {message}
        </div>
        {timestamp ? <span className="mt-1.5 text-xs text-muted">{timestamp}</span> : null}
      </div>
    </div>
  );
}
