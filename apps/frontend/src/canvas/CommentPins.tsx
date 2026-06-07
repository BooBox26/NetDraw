// Overlay rendered inside the canvas viewport that pins anchored comments
// at their world coordinates. Clicking a pin opens the comments panel.

import { useComments, setCommentStatus } from '../lib/comments';

export function CommentPins({ projectId }: { projectId: string | null }): JSX.Element | null {
  const comments = useComments(projectId);
  if (comments.length === 0) return null;
  return (
    <g aria-hidden>
      {comments.map((c) => (
        <g
          key={c.id}
          transform={`translate(${c.x} ${c.y})`}
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            document.dispatchEvent(new CustomEvent('nd:open-comments'));
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setCommentStatus(projectId, c.id, c.status === 'open' ? 'resolved' : 'open');
          }}
        >
          <circle
            cx="0"
            cy="0"
            r="10"
            fill={c.status === 'resolved' ? '#10b981' : '#f59e0b'}
            stroke="white"
            strokeWidth="2"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fontSize="11"
            fill="white"
            fontWeight="bold"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {c.replies.length + 1}
          </text>
        </g>
      ))}
    </g>
  );
}
