import { useState } from 'react'

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', message: '' })
    const [status, setStatus] = useState('')

    function update(e) {
        const { name, value } = e.target
        setForm((s) => ({ ...s, [name]: value }))
    }

    function validate() {
        return form.name.trim() && form.email.includes('@') && form.message.trim()
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!validate()) {
            setStatus('Please fill all fields correctly.')
            return
        }
        
        setStatus('Sending...')

        try {
            const response = await fetch('https://formspree.io/f/xaqkkaww', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(form)
            })

            if (response.ok) {
                setStatus('Thanks — I received your message!')
                setForm({ name: '', email: '', message: '' })
            } else {
                setStatus('Something went wrong. Please try again.')
            }
        } catch (error) {
            setStatus('Network error. Please try again.')
        }
    }

    return (
        <section id="contact" className="contact container">
            <h2>Contact</h2>
            <form className="contact-form" onSubmit={handleSubmit}>
                <label>
                    Name
                    <input name="name" value={form.name} onChange={update} />
                </label>
                <label>
                    Email
                    <input name="email" value={form.email} onChange={update} />
                </label>
                <label>
                    Message
                    <textarea name="message" value={form.message} onChange={update} rows={5} />
                </label>
                <div className="form-row">
                    <button type="submit" className="counter">Send</button>
                    <div className="status">{status}</div>
                </div>
            </form>
        </section>
    )
}