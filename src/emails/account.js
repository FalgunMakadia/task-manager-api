const mailer = require('@sendgrid/mail')

mailer.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    mailer.send({
        to: email,
        from: 'falgunmakadia12@gmail.com',
        subject: 'TaskApp - sendGrid: Welcome Email',
        text: `Welcome to the app ${name}. Let me know how you get along with the app.`
    })
}

const sendCancelationEmail = (email, name) => {
    mailer.send({
        to: email,
        from: 'falgunmakadia12@gmail.com',
        subject: 'TaskApp - sendGrid: Cancelation Email',
        text: `Hello ${name}. We have processed your request of account deletion. Please help us understand where we were not up to your mark.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}