import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components'

interface OrderDeliveryFailedEmailProps {
  order: {
    orderId: string
    customerEmail: string
    trackingNumber?: string
    carrier?: string
    attemptedDelivery?: Date
    reason?: string
    nextAttempt?: Date
    shippingAddress: {
      street: string
      city: string
      postalCode: string
      country: string
    }
  }
}

export default function OrderDeliveryFailedEmail({ order }: OrderDeliveryFailedEmailProps) {
  const formatDate = (date?: Date) => {
    if (!date) return 'Ukjent'
    return new Date(date).toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (date?: Date) => {
    if (!date) return 'Ukjent'
    return new Date(date).toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Html>
      <Head />
      <Preview>Leveringsforsøk mislyktes for ordre #{order.orderId} - PROFFSY</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src="https://proffsy.no/logo.png"
              width="150"
              height="50"
              alt="PROFFSY"
              style={logo}
            />
          </Section>

          <Section style={headerSection}>
            <div style={warningIcon}>⚠️</div>
            <Heading style={h1}>Leveringsforsøk mislyktes</Heading>
            <Text style={text}>
              Vi prøvde å levere din ordre <strong>#{order.orderId}</strong>, men leveringen mislyktes.
            </Text>
          </Section>

          <Section style={attemptSection}>
            <div style={attemptBox}>
              <Heading style={attemptTitle}>📦 Leveringsinformasjon</Heading>
              
              <div style={attemptDetails}>
                <div style={detailRow}>
                  <Text style={detailLabel}>Leveringsforsøk:</Text>
                  <Text style={detailValue}>{formatDateTime(order.attemptedDelivery)}</Text>
                </div>
                
                <div style={detailRow}>
                  <Text style={detailLabel}>Årsak:</Text>
                  <Text style={detailValue}>{order.reason || 'Mottaker ikke tilstede'}</Text>
                </div>
                
                {order.trackingNumber && (
                  <div style={detailRow}>
                    <Text style={detailLabel}>Sporingsnummer:</Text>
                    <Text style={detailValue}>{order.trackingNumber}</Text>
                  </div>
                )}
                
                <div style={detailRow}>
                  <Text style={detailLabel}>Fraktselskap:</Text>
                  <Text style={detailValue}>{order.carrier || 'PostNord'}</Text>
                </div>
              </div>
            </div>
          </Section>

          <Section style={nextStepsSection}>
            <Heading style={h2}>🔄 Neste steg</Heading>
            
            {order.nextAttempt ? (
              <div style={nextAttemptBox}>
                <Text style={nextAttemptTitle}>📅 Nytt leveringsforsøk</Text>
                <Text style={nextAttemptText}>
                  Vi vil prøve å levere pakken igjen <strong>{formatDate(order.nextAttempt)}</strong>
                </Text>
                <Text style={nextAttemptText}>
                  💡 Sørg for at noen er tilstede på leveringsadressen
                </Text>
              </div>
            ) : (
              <div style={actionBox}>
                <Text style={actionTitle}>📞 Ta kontakt med oss</Text>
                <Text style={actionText}>
                  For å avtale ny leveringstid eller endre leveringsadresse, vennligst kontakt oss.
                </Text>
              </div>
            )}
          </Section>

          <Section style={addressSection}>
            <Heading style={h2}>📍 Leveringsadresse</Heading>
            <div style={addressBox}>
              <Text style={addressText}>
                {order.shippingAddress.street}<br />
                {order.shippingAddress.postalCode} {order.shippingAddress.city}<br />
                {order.shippingAddress.country}
              </Text>
            </div>
            <Text style={infoText}>
              💡 Feil adresse? Kontakt oss så snart som mulig for å oppdatere leveringsadressen.
            </Text>
          </Section>

          <Section style={optionsSection}>
            <Heading style={h2}>🛠️ Dine alternativer</Heading>
            
            <div style={optionsList}>
              <div style={optionItem}>
                <Text style={optionTitle}>🏠 Vente på nytt forsøk</Text>
                <Text style={optionText}>Vi prøver automatisk på nytt neste arbeidsdag</Text>
              </div>
              
              <div style={optionItem}>
                <Text style={optionTitle}>📦 Henting på utleveringssted</Text>
                <Text style={optionText}>Be om å få pakken sendt til et hentested i nærheten</Text>
              </div>
              
              <div style={optionItem}>
                <Text style={optionTitle}>📍 Endre leveringsadresse</Text>
                <Text style={optionText}>Oppdater til en adresse hvor noen kan motta pakken</Text>
              </div>
            </div>
          </Section>

          <Section style={contactSection}>
            <div style={contactBox}>
              <Text style={contactTitle}>📞 Trenger du hjelp?</Text>
              <Text style={contactText}>
                Kontakt vår kundeservice på{' '}
                <Link href="mailto:ordre@proffsy.no" style={link}>ordre@proffsy.no</Link>{' '}
                eller ring oss på <strong>+47 12345678</strong>
              </Text>
              <Text style={contactText}>
                Husk å oppgi ordrenummer: <strong>#{order.orderId}</strong>
              </Text>
            </div>
          </Section>

          <Section style={footerSection}>
            <Text style={footerText}>
              Med vennlig hilsen,<br />
              <strong>PROFFSY Team</strong>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  margin: '40px auto',
  padding: '20px',
  width: '600px',
}

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const logo = {
  margin: '0 auto',
}

const headerSection = {
  marginBottom: '32px',
  textAlign: 'center' as const,
}

const warningIcon = {
  fontSize: '48px',
  marginBottom: '16px',
}

const h1 = {
  color: '#dc2626',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const h2 = {
  color: '#334155',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const text = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 12px 0',
}

const attemptSection = {
  marginBottom: '32px',
}

const attemptBox = {
  backgroundColor: '#fef2f2',
  border: '2px solid #dc2626',
  borderRadius: '8px',
  padding: '20px',
}

const attemptTitle = {
  color: '#dc2626',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
}

const attemptDetails = {
  display: 'grid',
  gap: '8px',
}

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const detailLabel = {
  color: '#dc2626',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
}

const detailValue = {
  color: '#7f1d1d',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
}

const nextStepsSection = {
  marginBottom: '32px',
}

const nextAttemptBox = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #0ea5e9',
  borderRadius: '6px',
  padding: '16px',
}

const nextAttemptTitle = {
  color: '#0c4a6e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
}

const nextAttemptText = {
  color: '#075985',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px 0',
}

const actionBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  borderRadius: '6px',
  padding: '16px',
}

const actionTitle = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
}

const actionText = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const addressSection = {
  marginBottom: '32px',
}

const addressBox = {
  backgroundColor: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  padding: '16px',
  marginBottom: '12px',
}

const addressText = {
  color: '#334155',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const infoText = {
  color: '#64748b',
  fontSize: '12px',
  fontStyle: 'italic',
  margin: '0',
}

const optionsSection = {
  marginBottom: '32px',
}

const optionsList = {
  display: 'grid',
  gap: '12px',
}

const optionItem = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '12px',
}

const optionTitle = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 4px 0',
}

const optionText = {
  color: '#64748b',
  fontSize: '13px',
  margin: '0',
}

const contactSection = {
  marginBottom: '32px',
}

const contactBox = {
  backgroundColor: '#f1f5f9',
  border: '1px solid #3b82f6',
  borderRadius: '6px',
  padding: '16px',
  textAlign: 'center' as const,
}

const contactTitle = {
  color: '#1e40af',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const contactText = {
  color: '#1e3a8a',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px 0',
}

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
}

const footerSection = {
  borderTop: '1px solid #e2e8f0',
  paddingTop: '16px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0',
} 