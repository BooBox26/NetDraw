import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Editor } from './routes/Editor';
import { Dashboard } from './routes/Dashboard';
import { Embed } from './routes/Embed';

export function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/editor/:id" element={<Editor />} />
        <Route path="/embed/:id" element={<Embed />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
