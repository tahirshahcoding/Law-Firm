import { getServerDashboardStats } from '@/lib/server-api';
import DashboardClientContent from './DashboardClientContent';

export default async function DashboardPage() {
  const initialStats = await getServerDashboardStats();

  return <DashboardClientContent initialStats={initialStats} />;
}
