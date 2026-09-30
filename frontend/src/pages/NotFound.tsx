import { Link } from 'react-router-dom';
import { CompassIcon } from 'lucide-react';
import { EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        icon={CompassIcon}
        title="Page not found"
        description="The page you are looking for does not exist."
        action={
          <Button variant="outline" asChild>
            <Link to="/">Go to dashboard</Link>
          </Button>
        }
      />
    </Card>
  );
}
