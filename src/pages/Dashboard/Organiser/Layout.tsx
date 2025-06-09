import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { User, Settings, Bell, Image } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  basePath: string;
}

const Layout = ({ children, basePath }: LayoutProps) => {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Profile',
      href: `${basePath}`,
      icon: User,
    },
    {
      name: 'Settings',
      href: `${basePath}/settings`,
      icon: Settings,
    },
    {
      name: 'Notifications',
      href: `${basePath}/settings/notifications`,
      icon: Bell,
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full lg:w-64">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Button
                  key={item.name}
                  asChild
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default Layout; 