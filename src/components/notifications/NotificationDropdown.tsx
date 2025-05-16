import React, { useEffect, useState, useMemo } from 'react';
import { Bell, Settings, Trash2, Check, CheckCheck, Filter, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { AppNotification } from '@/types/notification';

const getNotificationIcon = (type: AppNotification['type']) => {
  switch (type) {
    case 'user_registered':
      return '👤';
    case 'exhibition_created':
      return '🎪';
    case 'stall_booked':
      return '🎫';
    case 'stall_updated':
      return '🔄';
    case 'application_received':
      return '📝';
    default:
      return '📢';
  }
};

type FilterType = 'all' | 'unread' | 'read';
type GroupBy = 'none' | 'type' | 'date';

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { settings, updateSettings } = useNotificationSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('date');

  // Request notification permission on component mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const handleSettingsClick = () => {
    navigate('/dashboard/settings/notifications');
    setIsOpen(false);
  };

  const toggleSetting = (key: string, value: boolean) => {
    updateSettings({ [key]: value });
  };

  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];
    
    // Apply filter
    switch (filterType) {
      case 'unread':
        filtered = filtered.filter(n => !n.isRead);
        break;
      case 'read':
        filtered = filtered.filter(n => n.isRead);
        break;
    }

    return filtered;
  }, [notifications, filterType]);

  const groupedNotifications = useMemo(() => {
    if (groupBy === 'none') return { 'All': filteredNotifications };

    if (groupBy === 'type') {
      return filteredNotifications.reduce((groups, notification) => {
        const type = notification.type.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        if (!groups[type]) groups[type] = [];
        groups[type].push(notification);
        return groups;
      }, {} as Record<string, AppNotification[]>);
    }

    return filteredNotifications.reduce((groups, notification) => {
      let date = new Date(notification.createdAt);
      let key = isToday(date) 
        ? 'Today'
        : isYesterday(date)
          ? 'Yesterday'
          : format(date, 'MMMM d, yyyy');
      if (!groups[key]) groups[key] = [];
      groups[key].push(notification);
      return groups;
    }, {} as Record<string, AppNotification[]>);
  }, [filteredNotifications, groupBy]);

  return (
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-exhibae-coral text-white text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ''}</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent className="w-80" align="end">
          <DropdownMenuLabel className="flex justify-between items-center">
            <span>Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-exhibae-navy hover:text-exhibae-navy/90"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all as read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSettingsClick}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <div className="p-2 flex items-center justify-between">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  {filterType === 'all' ? 'All' : filterType === 'unread' ? 'Unread' : 'Read'}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
                      <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="unread">Unread</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="read">Read</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Clock className="h-4 w-4 mr-2" />
                  Group by {groupBy === 'none' ? 'None' : groupBy === 'type' ? 'Type' : 'Date'}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
                      <DropdownMenuRadioItem value="none">None</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="type">Type</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </div>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <ScrollArea className="h-[400px]">
            {Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
              <div key={group}>
                <div className="px-4 py-2 bg-gray-50">
                  <span className="text-sm font-medium text-gray-500">{group}</span>
                  <Badge className="ml-2 bg-gray-200 text-gray-700">{groupNotifications.length}</Badge>
                </div>
                {groupNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`p-4 cursor-pointer ${!notification.isRead ? 'bg-gray-50' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className="text-xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{notification.title}</div>
                        <div className="text-sm text-gray-600">{notification.message}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                      {!notification.isRead ? (
                        <div className="h-2 w-2 bg-exhibae-coral rounded-full mt-1" />
                      ) : (
                        <Check className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
};

export default NotificationDropdown; 