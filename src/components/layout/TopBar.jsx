import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';

function TopBar({ title, showBack = false, rightAction, transparent = false }) {
  const navigate = useNavigate();

  return (
    <header className={`lg:hidden sticky top-0 z-30 ${transparent ? '' : 'bg-bg border-b border-gray-100'}`}>
      <div className="flex items-center h-14 px-4 lg:px-8 max-w-md lg:max-w-none mx-auto gap-3">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        {title && (
          <h1 className="font-display font-semibold text-lg flex-1 truncate">{title}</h1>
        )}
        <div className="ml-auto">{rightAction}</div>
      </div>
    </header>
  );
}

export default TopBar;
