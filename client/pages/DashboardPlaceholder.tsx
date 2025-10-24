import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlaceholderProps {
  title: string;
  description: string;
}

export default function DashboardPlaceholder({ title, description }: PlaceholderProps) {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <Link to="/dashboard">
          <Button variant="outline" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {description}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Continue prompting to fill in this page's contents if you want it implemented.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
