import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import cn from 'classnames';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC } from 'react';

import { Tag } from '../ui/Tag';

export type SubTabItem = { label: string; href: string; tag?: string };

type SubTabsProps = {
  items: SubTabItem[];
};

const SubTabs: FC<SubTabsProps> = ({ items }) => {
  const { asPath } = useRouter();

  return (
    <NavigationMenu.Root className="h-full">
      <NavigationMenu.List className="flex h-[var(--app-tabbar-height)] flex-row items-center gap-2 border-b border-neutral-900 px-2 py-1">
        {items.map((item, i) => (
          <NavigationMenu.Item key={`tab-item-${i}`}>
            <NavigationMenu.Link
              asChild
              className={cn(
                'block h-full rounded-md px-2 py-1.5 text-sm font-medium outline-none ring-white ring-offset-0 transition duration-200 focus-visible:ring-1',
                {
                  'text-neutral-100': asPath === item.href,
                  'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-100 focus-visible:text-neutral-100':
                    asPath !== item.href,
                },
              )}
            >
              <Link href={item.href}>
                {item.label}
                {item.tag && (
                  <Tag className="ml-1" color="sky">
                    {item.tag}
                  </Tag>
                )}
              </Link>
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        ))}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
};

export default SubTabs;
