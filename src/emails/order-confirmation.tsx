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
  Hr,
  Row,
  Column,
} from '@react-email/components'

interface OrderConfirmationEmailProps {
  order: {
    orderId: string
    customerEmail: string
    totalAmount: number
    shippingAmount: number
    items: Array<{
      name: string
      quantity: number
      price: number
    }>
    shippingAddress: {
      street: string
      city: string
      postalCode: string
      country: string
    }
  }
}

export default function OrderConfirmationEmail({ order }: OrderConfirmationEmailProps) {
  const formatPrice = (price: number) => `${price.toFixed(2)} kr`

  return (
    <Html>
      <Head />
      <Preview>Ordrebekreftelse for {order.orderId} - PROFFSY</Preview>
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
            <Heading style={h1}>Takk for din bestilling!</Heading>
            <Text style={text}>
              Vi har mottatt din ordre <strong>#{order.orderId}</strong> og bekrefter at den er registrert.
            </Text>
          </Section>

          <Section style={orderSection}>
            <Heading style={h2}>📦 Ordredetaljer</Heading>
            
            {order.items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemDetails}>
                  <Text style={itemName}>{item.name}</Text>
                  <Text style={itemQuantity}>Antall: {item.quantity}</Text>
                </Column>
                <Column style={itemPrice}>
                  <Text style={priceText}>{formatPrice(item.price * item.quantity)}</Text>
                </Column>
              </Row>
            ))}

            <Hr style={hr} />
            
            <Row style={totalRow}>
              <Column>
                <Text style={text}>Frakt:</Text>
              </Column>
              <Column style={totalColumn}>
                <Text style={text}>{formatPrice(order.shippingAmount)}</Text>
              </Column>
            </Row>
            
            <Row style={totalRow}>
              <Column>
                <Text style={totalText}>Totalt:</Text>
              </Column>
              <Column style={totalColumn}>
                <Text style={totalText}>{formatPrice(order.totalAmount)}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={shippingSection}>
            <Heading style={h2}>🚚 Leveringsadresse</Heading>
            <Text style={text}>
              {order.shippingAddress.street}<br />
              {order.shippingAddress.postalCode} {order.shippingAddress.city}<br />
              {order.shippingAddress.country}
            </Text>
          </Section>

          <Section style={infoSection}>
            <Text style={infoText}>
              📧 Du vil motta en epost med sporingsinformasjon når ordren din er sendt.
            </Text>
            <Text style={infoText}>
              📞 Har du spørsmål? Kontakt oss på{' '}
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

const orderSection = {
  marginBottom: '32px',
}

const itemRow = {
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '12px',
  paddingTop: '12px',
}

const itemDetails = {
  width: '70%',
}

const itemName = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 4px 0',
}

const itemQuantity = {
  color: '#64748b',
  fontSize: '12px',
  margin: '0',
}

const itemPrice = {
  textAlign: 'right' as const,
  width: '30%',
}

const priceText = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
}

const hr = {
  border: 'none',
  borderTop: '2px solid #e2e8f0',
  margin: '16px 0',
}

const totalRow = {
  marginBottom: '8px',
}

const totalColumn = {
  textAlign: 'right' as const,
}

const totalText = {
  color: '#1e293b',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
}

const shippingSection = {
  marginBottom: '32px',
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