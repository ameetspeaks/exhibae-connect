import { Metadata } from 'next';
import { SubscriptionList } from '@/components/manager/SubscriptionList';

export const metadata: Metadata = {
  title: 'Subscriptions | Manager',
  description: 'Manage newsletter subscriptions',
};

export default function SubscriptionsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Newsletter Subscriptions</h1>
      <SubscriptionList />
    </div>
  );
} 