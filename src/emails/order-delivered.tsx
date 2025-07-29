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
  Hr,
} from '@react-email/components'

interface OrderDeliveredEmailProps {
  order: {
    orderId: string
    customerEmail: string
    trackingNumber?: string
    carrier?: string
    actualDelivery?: Date
    shippingMethod?: string
    shippingLocation?: {
      name?: string
    }
  }
}

export default function OrderDeliveredEmail({ order }: OrderDeliveredEmailProps) {
  const formatDate = (date?: Date) => {
    if (!date) return 'i dag'
    return new Date(date).toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDeliveryText = () => {
    if (order.shippingMethod?.includes('pickup') || order.shippingLocation?.name) {
      return 'klar for henting'
    }
    return 'levert'
  }

  return (
    <Html>
      <Head />
      <Preview>Ordre #{order.orderId} er {getDeliveryText()}! 🎉 - PROFFSY</Preview>
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
            <div style={successIcon}>🎉</div>
            <Heading style={h1}>
              {order.shippingLocation?.name ? 'Pakken er klar for henting!' : 'Pakken er levert!'}
            </Heading>
            <Text style={text}>
              Din ordre <strong>#{order.orderId}</strong> er nå {getDeliveryText()}.
            </Text>
          </Section>

          <Section style={deliverySection}>
            <div style={deliveryBox}>
              <Heading style={deliveryTitle}>
                {order.shippingLocation?.name ? '📦 Hentebekreftelse' : '📦 Leveringsbekreftelse'}
              </Heading>
              
              <div style={deliveryDetails}>
                <div style={detailRow}>
                  <Text style={detailLabel}>Ordre:</Text>
                  <Text style={detailValue}>#{order.orderId}</Text>
                </div>
                
                {order.trackingNumber && (
                  <div style={detailRow}>
                    <Text style={detailLabel}>Sporingsnummer:</Text>
                    <Text style={detailValue}>{order.trackingNumber}</Text>
                  </div>
                )}
                
                <div style={detailRow}>
                  <Text style={detailLabel}>
                    {order.shippingLocation?.name ? 'Klar for henting:' : 'Levert:'}
                  </Text>
                  <Text style={detailValue}>{formatDate(order.actualDelivery)}</Text>
                </div>
                
                <div style={detailRow}>
                  <Text style={detailLabel}>Fraktselskap:</Text>
                  <Text style={detailValue}>{order.carrier || 'PostNord'}</Text>
                </div>
              </div>
            </div>
          </Section>

          {order.shippingLocation?.name && (
            <Section style={pickupSection}>
              <div style={alertBox}>
                <Text style={alertTitle}>📍 Henteinstruksjoner</Text>
                <Text style={alertText}>
                  Pakken din ligger klar på <strong>{order.shippingLocation.name}</strong>
                </Text>
                <Text style={alertText}>
                  💡 Husk å ta med gyldig ID og sporingsnummer når du henter pakken
                </Text>
                <Text style={alertText}>
                  ⏰ Pakken oppbevares i 10 dager før den sendes tilbake
                </Text>
              </div>
            </Section>
          )}

          <Section style={feedbackSection}>
            <Heading style={h2}>💬 Gi oss tilbakemelding</Heading>
            <Text style={text}>
              Vi håper du er fornøyd med din bestilling! Din mening betyr mye for oss.
            </Text>
            <Section style={buttonSection}>
              <Button href="https://proffsy.no/feedback" style={feedbackButton}>
                ⭐ Vurder din opplevelse
              </Button>
            </Section>
          </Section>

          <Section style={supportSection}>
            <Text style={supportText}>
              🛍️ Tusen takk for at du handlet hos oss!
            </Text>
            <Text style={supportText}>
              📞 Problemer med leveringen? Kontakt{' '}
              <Link href="mailto:ordre@proffsy.no" style={link}>ordre@proffsy.no</Link>
            </Text>
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

const successIcon = {
  fontSize: '48px',
  marginBottom: '16px',
}

const h1 = {
  color: '#16a34a',
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

const deliverySection = {
  marginBottom: '32px',
}

const deliveryBox = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #16a34a',
  borderRadius: '8px',
  padding: '20px',
}

const deliveryTitle = {
  color: '#15803d',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
}

const deliveryDetails = {
  display: 'grid',
  gap: '8px',
}

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const detailLabel = {
  color: '#15803d',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
}

const detailValue = {
  color: '#166534',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
}

const pickupSection = {
  marginBottom: '32px',
}

const alertBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  borderRadius: '6px',
  padding: '16px',
}

const alertTitle = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const alertText = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px 0',
}

const feedbackSection = {
  marginBottom: '32px',
  textAlign: 'center' as const,
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '20px 0',
}

const feedbackButton = {
  backgroundColor: '#f59e0b',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  lineHeight: '1',
  padding: '12px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
}

const supportSection = {
  backgroundColor: '#f1f5f9',
  borderRadius: '6px',
  marginBottom: '32px',
  padding: '16px',
  textAlign: 'center' as const,
}

const supportText = {
  color: '#475569',
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