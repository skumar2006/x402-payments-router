'use client';

import React, { useState } from 'react';
import { Button, IconButton } from '@coinbase/cds-web/buttons';
import { TextInput, InputIcon } from '@coinbase/cds-web/controls';
import { Text } from '@coinbase/cds-web/typography';
import { Link } from '@coinbase/cds-web/typography/Link';
import { ContentCard, ContentCardBody, ContentCardHeader } from '@coinbase/cds-web/cards';
import { Box, VStack, HStack, Divider } from '@coinbase/cds-web/layout';
import { Banner } from '@coinbase/cds-web/banner/Banner';

export default function CoinbaseDesignSystemDemo() {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [apiToken] = useState('HaeJiWplJohn6W42eCq0Qqft0');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <Box minHeight="100vh" background="bg" padding={6}>
      <Box maxWidth="800px" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
        <VStack gap={6}>
          {/* Page Header */}
          <VStack gap={2}>
            <Text font="display2" as="h1" color="fgPrimary">
              Coinbase Design System
            </Text>
            <Text font="body" color="fgMuted">
              A showcase of properly implemented CDS components
            </Text>
          </VStack>

          {/* Success Banner */}
          {showSuccess && (
            <Banner
              variant="informational"
              title="Form Submitted Successfully"
              startIcon="checkmark"
              startIconActive
              styleVariant="inline"
            >
              Your form has been submitted with the correct CDS styling.
            </Banner>
          )}

          {/* Main Form Card */}
          <ContentCard>
            <ContentCardHeader title="Example Form" />
            <ContentCardBody>
              <form onSubmit={handleSubmit}>
                <VStack gap={4}>
                  {/* Email Input with Icon */}
                  <TextInput
                    label="Email Address"
                    type="email"
                    placeholder="satoshi@nakamoto.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    helperText="We'll never share your email with anyone else"
                    start={<InputIcon name="email" />}
                  />

                  {/* Amount Input with Suffix */}
                  <TextInput
                    label="Amount"
                    type="number"
                    step="0.01"
                    placeholder="1234.56"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    suffix="USD"
                    compact
                  />

                  {/* Password Input with Toggle */}
                  <TextInput
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    end={
                      <IconButton
                        name={showPassword ? 'visible' : 'invisible'}
                        variant="foregroundMuted"
                        transparent
                        onClick={() => setShowPassword(!showPassword)}
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      />
                    }
                  />

                  {/* API Token with Copy Link */}
                  <TextInput
                    label="API Access Token"
                    value={apiToken}
                    readOnly
                    end={
                      <Box paddingEnd={2}>
                        <Link font="caption" color="fgPrimary" href="">
                          COPY
                        </Link>
                      </Box>
                    }
                  />

                  <Divider />

                  {/* Submit Button */}
                  <Button type="submit" variant="primary" width="100%">
                    Submit Form
                  </Button>
                </VStack>
              </form>
            </ContentCardBody>
          </ContentCard>

          {/* Input Variants Card */}
          <ContentCard>
            <ContentCardHeader title="Input Variants" />
            <ContentCardBody>
              <VStack gap={4}>
                {/* Default */}
                <TextInput
                  label="Default Variant"
                  placeholder="Type something..."
                  helperText="This is a standard text input"
                />

                {/* Positive */}
                <TextInput
                  label="Valid Address"
                  placeholder="1234 Main Street"
                  helperText="Valid address format"
                  variant="positive"
                  end={<InputIcon active color="fgPositive" name="checkmark" />}
                />

                {/* Negative */}
                <TextInput
                  label="Invalid Email"
                  placeholder="not-an-email"
                  helperText="Error: Please enter a valid email address"
                  variant="negative"
                  end={<InputIcon active color="fgNegative" name="error" />}
                />

                {/* With Color Surge */}
                <TextInput
                  label="Color Surge Enabled"
                  placeholder="Focus me to see the effect"
                  helperText="Color surge provides visual feedback on focus"
                  enableColorSurge
                />
              </VStack>
            </ContentCardBody>
          </ContentCard>

          {/* Label Variants Card */}
          <ContentCard>
            <ContentCardHeader title="Label Variants" />
            <ContentCardBody>
              <VStack gap={4}>
                {/* Outside Label (Default) */}
                <TextInput
                  label="Outside Label"
                  placeholder="Traditional label placement"
                  helperText="Label appears outside the input box"
                />

                {/* Inside Label */}
                <TextInput
                  label="Inside Label"
                  labelVariant="inside"
                  placeholder="Enter your search query"
                  helperText="Label appears inside the input box"
                />

                {/* Inside Label with Start Icon */}
                <TextInput
                  label="Search"
                  labelVariant="inside"
                  start={<InputIcon name="search" />}
                  placeholder="Search for anything"
                />
              </VStack>
            </ContentCardBody>
          </ContentCard>

          {/* Information Banner */}
          <Banner
            variant="warning"
            title="Design System Best Practices"
            startIcon="info"
            startIconActive
            styleVariant="inline"
          >
            <VStack gap={2}>
              <Text>Always use semantic HTML elements with the 'as' prop</Text>
              <Text>Provide helper text for better user experience</Text>
              <Text>Use proper spacing (gap values: 0, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 7, 8, 9)</Text>
              <Text>Leverage border radius values (100, 200, 300, 400, 500, 600, 700, 800, 900, 1000)</Text>
            </VStack>
          </Banner>

          {/* Typography Examples */}
          <ContentCard>
            <ContentCardHeader title="Typography Scale" />
            <ContentCardBody>
              <VStack gap={3}>
                <Text font="display1" as="h1">Display 1</Text>
                <Text font="display2" as="h2">Display 2</Text>
                <Text font="title1" as="h3">Title 1</Text>
                <Text font="title2" as="h4">Title 2</Text>
                <Text font="title3" as="h5">Title 3</Text>
                <Text font="headline">Headline</Text>
                <Text font="body">Body text for paragraphs and general content</Text>
                <Text font="label1">Label 1</Text>
                <Text font="label2">Label 2</Text>
                <Text font="caption">Caption text for small details</Text>
                <Text font="legal">Legal text for terms and conditions</Text>
              </VStack>
            </ContentCardBody>
          </ContentCard>

          {/* Layout Examples */}
          <ContentCard>
            <ContentCardHeader title="Layout Components" />
            <ContentCardBody>
              <VStack gap={4}>
                <Box>
                  <Text font="label1" as="p" paddingBottom={2}>
                    HStack Example (Horizontal Layout)
                  </Text>
                  <HStack gap={2}>
                    <Box background="bgPrimary" padding={3} borderRadius={200}>
                      <Text color="fgInverse">Item 1</Text>
                    </Box>
                    <Box background="bgPrimary" padding={3} borderRadius={200}>
                      <Text color="fgInverse">Item 2</Text>
                    </Box>
                    <Box background="bgPrimary" padding={3} borderRadius={200}>
                      <Text color="fgInverse">Item 3</Text>
                    </Box>
                  </HStack>
                </Box>

                <Divider />

                <Box>
                  <Text font="label1" as="p" paddingBottom={2}>
                    VStack Example (Vertical Layout)
                  </Text>
                  <VStack gap={2}>
                    <Box background="bgElevation1" padding={3} borderRadius={200}>
                      <Text>Vertical Item 1</Text>
                    </Box>
                    <Box background="bgElevation1" padding={3} borderRadius={200}>
                      <Text>Vertical Item 2</Text>
                    </Box>
                    <Box background="bgElevation1" padding={3} borderRadius={200}>
                      <Text>Vertical Item 3</Text>
                    </Box>
                  </VStack>
                </Box>
              </VStack>
            </ContentCardBody>
          </ContentCard>

          {/* Button Variants */}
          <ContentCard>
            <ContentCardHeader title="Button Variants" />
            <ContentCardBody>
              <VStack gap={3}>
                <Button variant="primary" width="100%">Primary Button</Button>
                <Button variant="secondary" width="100%">Secondary Button</Button>
                <Button variant="tertiary" width="100%">Tertiary Button</Button>
                <HStack gap={2}>
                  <Button variant="primary" disabled>Disabled</Button>
                  <Button variant="primary" loading>Loading</Button>
                </HStack>
              </VStack>
            </ContentCardBody>
          </ContentCard>
        </VStack>
      </Box>
    </Box>
  );
}

