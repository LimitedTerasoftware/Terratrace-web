import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-boxdark">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-stroke dark:text-white">404</h1>
        <p className="mb-8 text-xl font-medium text-body dark:text-bodydark">
          Oops! Page not found
        </p>
        <Link
          to="/"
          className="inline-block rounded bg-primary px-8 py-3 text-base font-medium text-white hover:bg-opacity-90"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
