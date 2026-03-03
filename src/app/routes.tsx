import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import SystemRequirements from './pages/SystemRequirements';
import Students from './pages/Students';
import Groups from './pages/Groups';
import Points from './pages/Points';
import Rules from './pages/Rules';
import Records from './pages/Records';
import Shop from './pages/Shop';
import Tools from './pages/Tools';
import Settings from './pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'system-requirements', Component: SystemRequirements },
      { path: 'students', Component: Students },
      { path: 'groups', Component: Groups },
      { path: 'points', Component: Points },
      { path: 'rules', Component: Rules },
      { path: 'records', Component: Records },
      { path: 'shop', Component: Shop },
      { path: 'tools', Component: Tools },
      { path: 'settings', Component: Settings },
    ],
  },
]);
