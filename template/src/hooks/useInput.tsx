import { useState } from 'react'

export function useInput({ type }: { type: string }): [string, JSX.Element] {
  const [value, setValue] = useState('')
  const input = (
    <input
      style={{ width: '100%' }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      type={type}
    />
  )
  return [value, input]
}
