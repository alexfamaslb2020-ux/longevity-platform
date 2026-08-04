import { redirect } from 'next/navigation';

export default function CheckinsRedirect() {
  redirect('/acompanhamento?tab=checkins');
}
