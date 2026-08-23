export function ErrorMessage({ message }: { message: string }) {
  return <div className="rounded-lg border border-loss/25 bg-loss/5 px-3 py-2 text-sm font-medium text-loss">{message}</div>
}
