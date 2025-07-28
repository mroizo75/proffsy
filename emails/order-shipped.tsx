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

interface OrderShippedEmailProps {
  order: {
    orderId: string
    customerEmail: string
    trackingNumber?: string
    trackingUrl?: string
    carrier?: string
    estimatedDelivery?: Date
    shippingMethod?: string
    shippingLocation?: {
      name?: string
      address?: {
        street?: string
        city?: string
        postalCode?: string
      }
    }
    shippingAddress: {
      street: string
      city: string
      postalCode: string
      country: string
    }
  }
}

export default function OrderShippedEmail({ order }: OrderShippedEmailProps) {
  const formatDate = (date?: Date) => {
    if (!date) return 'Ukjent'
    return new Date(date).toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDeliveryMethodText = () => {
    if (order.shippingMethod?.includes('pickup') || order.shippingLocation?.name) {
      return '📦 Henting på utleveringssted'
    }
    return '🏠 Hjemlevering'
  }

  return (
    <Html>
      <Head />
      <Preview>Ordre #{order.orderId} er sendt! 📦 - PROFFSY</Preview>
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
            <Heading style={h1}>📦 Pakken din er sendt!</Heading>
            <Text style={text}>
              God nyhet! Din ordre <strong>#{order.orderId}</strong> er nå på vei til deg.
            </Text>
          </Section>

          <Section style={trackingSection}>
            <Heading style={h2}>🚚 Sporingsinformasjon</Heading>
            
            {order.trackingNumber && (
              <div style={trackingBox}>
                <Text style={trackingLabel}>Sporingsnummer:</Text>
                <Text style={trackingNumber}>{order.trackingNumber}</Text>
              </div>
            )}

            <div style={infoGrid}>
              <div style={infoItem}>
                <Text style={infoLabel}>Fraktselskap:</Text>
                <Text style={infoValue}>{order.carrier || 'PostNord'}</Text>
              </div>
              
              <div style={infoItem}>
                <Text style={infoLabel}>Leveringsmåte:</Text>
                <Text style={infoValue}>{getDeliveryMethodText()}</Text>
              </div>
              
              <div style={infoItem}>
                <Text style={infoLabel}>Forventet levering:</Text>
                <Text style={infoValue}>{formatDate(order.estimatedDelivery)}</Text>
              </div>
            </div>

            {order.trackingUrl && (
              <Section style={buttonSection}>
                <Button href={order.trackingUrl} style={trackingButton}>
                  📍 Spor pakken din
                </Button>
              </Section>
            )}
          </Section>

          {order.shippingLocation?.name ? (
            <Section style={deliverySection}>
              <Heading style={h2}>📍 Hentested</Heading>
              <div style={locationBox}>
                <Text style={locationName}>{order.shippingLocation.name}</Text>
                {order.shippingLocation.address && (
                  <Text style={locationAddress}>
                    {order.shippingLocation.address.street}<br />
                    {order.shippingLocation.address.postalCode} {order.shippingLocation.address.city}
                  </Text>
                )}
                <Text style={infoText}>
                  💡 Husk å ta med gyldig ID når du henter pakken
                </Text>
              </div>
            </Section>
          ) : (
            <Section style={deliverySection}>
              <Heading style={h2}>🏠 Leveringsadresse</Heading>
              <Text style={text}>
                {order.shippingAddress.street}<br />
                {order.shippingAddress.postalCode} {order.shippingAddress.city}<br />
                {order.shippingAddress.country}
              </Text>
            </Section>
          )}

          <Section style={infoSection}>
            <Text style={infoText}>
              📧 Du vil få en ny epost når pakken er levert eller klar for henting.
            </Text>
            <Text style={infoText}>
              📞 Spørsmål om leveringen? Kontakt{' '}
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
}

const h1 = {
  color: '#1e293b',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
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

const trackingSection = {
  marginBottom: '32px',
}

const trackingBox = {
  backgroundColor: '#f1f5f9',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  marginBottom: '20px',
}

const trackingLabel = {
  color: '#64748b',
  fontSize: '12px',
  margin: '0 0 4px 0',
  textTransform: 'uppercase' as const,
  fontWeight: '600',
}

const trackingNumber = {
  color: '#1e293b',
  fontSize: '20px',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  margin: '0',
  letterSpacing: '2px',
}

const infoGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '16px',
  marginBottom: '20px',
}

const infoItem = {
  textAlign: 'center' as const,
}

const infoLabel = {
  color: '#64748b',
  fontSize: '12px',
  margin: '0 0 4px 0',
  fontWeight: '600',
}

const infoValue = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const trackingButton = {
  backgroundColor: '#3b82f6',
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

const deliverySection = {
  marginBottom: '32px',
}

const locationBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  borderRadius: '6px',
  padding: '16px',
  marginBottom: '16px',
}

const locationName = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
}

const locationAddress = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 12px 0',
}

const infoSection = {
  backgroundColor: '#f1f5f9',
  borderRadius: '6px',
  marginBottom: '32px',
  padding: '16px',
}

const infoText = {
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