import { useRouter } from 'next/router';

export default function Table() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div>
      <h1>Table {id}</h1>
      <p>PLACEHOLDER</p>
    </div>
  );
}
