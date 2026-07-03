export default function Island({ island, onExit }) {
  return (
    <div>
      <p>Island: {island.id} (coming soon)</p>
      <button onClick={onExit}>Back</button>
    </div>
  );
}
