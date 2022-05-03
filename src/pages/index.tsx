import { GetServerSideProps } from "next"
import { parseCookies } from "nookies"
import { FormEvent, useState } from "react"
import useAuth from "../context/AuthContext"
import styles from '../styles/Home.module.scss'
import { withSSRGuest } from "../utils/withSSRGuest"

export default function Home() {
  const {signIn} = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const data = {
      email, password
    }

    await signIn(data)
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        <input name="email" value={email} onChange={e => setEmail(e.target.value)}  />
        <input name="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Entrar</button>
      </form>
    </div>
  )
}

export const getServerSideProps = withSSRGuest(async (ctx) => {
  return {
    props: {}
  }
})