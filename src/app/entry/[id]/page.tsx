'use client'

import { useParams } from 'next/navigation'
import EntryView from './EntryView'

export default function Page() {
  const params = useParams()
  return <EntryView id={params.id as string} />
}
