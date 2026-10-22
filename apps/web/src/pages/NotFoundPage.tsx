import { Link } from 'react-router';
import { PlaceholderPage } from './PlaceholderPage.tsx';

export function NotFoundPage() {
  return (
    <PlaceholderPage title="Page not found">
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-4 inline-block text-primary hover:underline">
        Go home
      </Link>
    </PlaceholderPage>
  );
}
