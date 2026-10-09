'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Locale } from '@/shared/config/locale';
import { showcase } from '@/shared/config/showcase';

type Message = { id: string; role: 'user' | 'assistant'; content: string };
export function Assistant({ locale }: { locale: Locale }) {
  const fa = locale === 'fa';
  const t = (a: string, b: string) => (fa ? a : b);
  const dialog = useRef<HTMLDialogElement>(null);
  const controller = useRef<AbortController | null>(null);
  const pending = useRef(false);
  const list = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const status = new AbortController();
    fetch('/api/assistant/config', { signal: status.signal })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => setAvailable(data.available))
      .catch(() => {
        if (!status.signal.aborted) setAvailable(false);
      });
    return () => {
      status.abort();
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (messages.length)
      list.current?.scrollTo({
        top: list.current.scrollHeight,
        behavior: 'instant',
      });
  }, [messages]);
  async function send(text: string) {
    if (!text.trim() || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setCopied(false);
    const next: Message[] = [
      ...messages,
      { id: crypto.randomUUID(), role: 'user', content: text.trim() },
    ];
    setMessages(next);
    setInput('');
    const request = new AbortController();
    controller.current = request;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-11) }),
        signal: request.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error();
      if (!request.signal.aborted)
        setMessages([...next, { id: crypto.randomUUID(), role: 'assistant', content: data.reply }]);
    } catch {
      if (!request.signal.aborted) {
        setMessages(messages);
        setInput(text);
        setError(
          t(
            'پاسخی دریافت نشد. پیام شما حفظ شده است؛ دوباره تلاش کنید.',
            'No reply received. Your message is preserved—please retry.',
          ),
        );
      }
    } finally {
      if (!request.signal.aborted) setBusy(false);
      pending.current = false;
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }
  const prompts = fa
    ? [
        'روش اجرای پروژه چگونه است؟',
        'برای شروع همکاری چه اطلاعاتی لازم است؟',
        'یک پیش‌نویس قرارداد با جای خالی تهیه کن.',
      ]
    : [
        'How does your project process work?',
        'What do you need to start a project?',
        'Prepare a first contract draft with placeholders.',
      ];
  const latest = messages.filter((message) => message.role === 'assistant').at(-1);
  return (
    <>
      <button
        className="assistant-launcher"
        type="button"
        aria-haspopup="dialog"
        aria-label={showcase[locale].assistant}
        onClick={() => dialog.current?.showModal()}
      >
        <span className="assistant-symbol" aria-hidden="true">
          ✳
        </span>
        <span>{showcase[locale].assistant}</span>
        <small dir="ltr">AI</small>
      </button>
      <dialog ref={dialog} className="assistant-dialog" aria-labelledby="assistant-title">
        <header>
          <div>
            <span className="chapter-index" dir="ltr">
              BARGHINO / ASSISTANT
            </span>
            <h2 id="assistant-title">{showcase[locale].assistant}</h2>
          </div>
          <button
            type="button"
            className="dialog-close"
            aria-label={t('بستن دستیار', 'Close assistant')}
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </header>
        <p className="assistant-intro">{showcase[locale].assistantIntro}</p>
        {available === false ? (
          <div className="assistant-offline">
            <p>
              {t(
                'دستیار هنوز متصل نشده است. برای بررسی پروژه، خلاصهٔ نیازتان را ثبت کنید.',
                'The assistant is not connected yet. Share your project brief to begin a conversation.',
              )}
            </p>
            <button
              type="button"
              className="solid-button"
              onClick={() => {
                dialog.current?.close();
                document.getElementById('project')?.scrollIntoView();
              }}
            >
              {t('تعریف پروژه', 'Your project')} ↗
            </button>
          </div>
        ) : (
          <>
            <div className="assistant-prompts">
              {messages.length === 0 &&
                prompts.map((prompt) => (
                  <button
                    type="button"
                    key={prompt}
                    disabled={busy || available === null}
                    onClick={() => void send(prompt)}
                  >
                    {prompt}
                    <span aria-hidden="true">↗</span>
                  </button>
                ))}
            </div>
            <div
              ref={list}
              className="assistant-messages"
              role="log"
              aria-label={t('گفت‌وگو', 'Conversation')}
              aria-live="polite"
              aria-relevant="additions text"
            >
              {messages.map((message) => (
                <article key={message.id} data-role={message.role}>
                  <small>
                    {message.role === 'user'
                      ? t('شما', 'YOU')
                      : t('برقینو / هوش مصنوعی', 'BARGHINO / AI')}
                  </small>
                  <p dir="auto">{message.content}</p>
                </article>
              ))}
              {busy && (
                <p role="status" className="assistant-thinking">
                  {t('در حال بررسی…', 'Considering your question…')}
                  <span aria-hidden="true"> · · ·</span>
                </p>
              )}
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {latest && (
              <button
                className="text-button"
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(latest.content);
                    setCopied(true);
                  } catch {
                    setError(
                      t('برای کپی، متن پاسخ را انتخاب کنید.', 'Select the reply text to copy it.'),
                    );
                  }
                }}
              >
                {copied
                  ? t('کپی شد', 'Copied')
                  : t('کپی آخرین پاسخ / پیش‌نویس', 'Copy last reply / draft')}
              </button>
            )}
            <form onSubmit={submit} className="assistant-compose">
              <label className="sr-only" htmlFor="assistant-input">
                {t('پیام شما', 'Your message')}
              </label>
              <textarea
                id="assistant-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={2}
                maxLength={2000}
                required
                disabled={busy}
                placeholder={t('سؤال شما…', 'Your question…')}
              />
              <button
                type="submit"
                disabled={busy || !input.trim() || available === null}
                aria-label={t('ارسال پیام', 'Send message')}
              >
                ↗
              </button>
            </form>
            <p className="assistant-footnote">
              {t(
                'پاسخ‌های هوش مصنوعی برای راهنمایی و پیش‌نویس هستند. پیام شما برای تولید پاسخ به Groq ارسال می‌شود.',
                'AI replies are guidance and first drafts. Your message is sent to Groq to generate a reply.',
              )}
            </p>
          </>
        )}
      </dialog>
    </>
  );
}
