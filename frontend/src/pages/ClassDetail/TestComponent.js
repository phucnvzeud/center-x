import React from 'react';
import {
  Box,
  Heading,
  Text,
  Container,
  Button,
  Stack,
  Flex,
} from '@chakra-ui/react';

const TestComponent = () => {
  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8} data-aos="fade-up">
        <Heading as="h1" size="xl" mb={4} color="brand.600">
          Chakra UI Test
        </Heading>
        <Text fontSize="lg" color="gray.600">
          This is a simple test component to verify Chakra UI is working correctly.
        </Text>
      </Box>
      
      <Stack spacing={6}>
        <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg" data-aos="fade-up" data-aos-delay="100">
          <Heading size="md" mb={4}>
            Card Test
          </Heading>
          <Text mb={4}>This is a test card to verify styling is working correctly.</Text>
          <Button colorScheme="blue">
            Test Button
          </Button>
        </Box>
        
        <Flex justify="center" data-aos="fade-up" data-aos-delay="200">
          <Button colorScheme="green" size="lg">
            Action Button
          </Button>
        </Flex>
      </Stack>
    </Container>
  );
};

export default TestComponent; 