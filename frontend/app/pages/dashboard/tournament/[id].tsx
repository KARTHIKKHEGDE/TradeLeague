import { useRouter } from 'next/router';

export default function TournamentDetail() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div>
      <h1>Tournament {id}</h1>
    </div>
  );
}
