import { ChatPanel } from '../src/components/ChatPanel';
import { ReadingDashboard } from '../src/components/ReadingDashboard';

export default function HomePage() {
  return (
    <section className="space-y-8">
      <ChatPanel />
      <ReadingDashboard />
    </section>
  );
}
