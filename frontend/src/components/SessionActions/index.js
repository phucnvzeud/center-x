/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import {
  Box, 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalCloseButton,
  VStack,
  Button,
  Flex,
  Text,
  Icon,
  useDisclosure
} from '@chakra-ui/react';
import { FaCheck, FaTimes, FaEdit, FaTrash } from 'react-icons/fa';

/**
 * A component that shows a modal with contextual actions when a session row is clicked
 * 
 * @param {Object} props
 * @param {Object} props.session - The session object
 * @param {Function} props.onMarkCompleted - Function to call when marking session as completed
 * @param {Function} props.onMarkCanceled - Function to call when marking session as canceled
 * @param {Function} props.onAdvancedEdit - Function to call when advanced edit is selected
 * @param {Function} props.onDelete - Function to call when delete is selected (optional)
 * @param {Boolean} props.isLoading - Whether an action is in progress
 * @param {React.ReactNode} props.children - Content that will trigger the modal when clicked
 * @param {String} props.completedLabel - Label for the completed button (default: "Mark Completed")
 * @param {String} props.canceledLabel - Label for the canceled button (default: "Mark Canceled")
 * @param {Boolean} props.showDelete - Whether to show the delete button (default: false)
 */
const SessionActions = ({
  session,
  onMarkCompleted,
  onMarkCanceled,
  onAdvancedEdit,
  onDelete,
  isLoading = false,
  children,
  completedLabel = "Mark Completed",
  canceledLabel = "Mark Canceled",
  showDelete = false
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Determine which buttons to show based on current status
  const showCompletedButton = session.status !== 'Completed' && 
                              session.status !== 'Taught';
  
  const showCanceledButton = session.status !== 'Canceled' && 
                             !session.status.startsWith('Absent');

  const handleAction = (actionFn) => {
    if (actionFn) {
      actionFn();
    }
    onClose();
  };

  return (
    <>
      {/* Clickable row wrapper */}
      <Box 
        onClick={onOpen} 
        cursor="pointer" 
        width="100%" 
        height="100%" 
        position="absolute" 
        top="0" 
        left="0"
        _hover={{ bg: "blackAlpha.50" }}
        borderRadius="md"
        transition="all 0.2s"
      >
        {children}
      </Box>
      
      {/* Modal with actions */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="xs">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Session Actions</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={3} align="stretch">
              {showCompletedButton && (
                <Button
                  leftIcon={<Icon as={FaCheck} />}
                  colorScheme="green"
                  onClick={() => handleAction(onMarkCompleted)}
                  isDisabled={isLoading}
                  size="md"
                  justifyContent="flex-start"
                >
                  {completedLabel}
                </Button>
              )}
              
              {showCanceledButton && (
                <Button
                  leftIcon={<Icon as={FaTimes} />}
                  colorScheme="red"
                  onClick={() => handleAction(onMarkCanceled)}
                  isDisabled={isLoading}
                  size="md"
                  justifyContent="flex-start"
                >
                  {canceledLabel}
                </Button>
              )}
              
              <Button
                leftIcon={<Icon as={FaEdit} />}
                colorScheme="blue"
                onClick={() => handleAction(onAdvancedEdit)}
                isDisabled={isLoading}
                size="md"
                justifyContent="flex-start"
              >
                Advanced Edit
              </Button>
              
              {showDelete && onDelete && (
                <Button
                  leftIcon={<Icon as={FaTrash} />}
                  colorScheme="red"
                  variant="outline"
                  onClick={() => handleAction(onDelete)}
                  isDisabled={isLoading}
                  size="md"
                  justifyContent="flex-start"
                >
                  Delete Session
                </Button>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SessionActions; 