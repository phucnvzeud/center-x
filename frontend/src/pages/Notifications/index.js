import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { 
  Box, 
  Heading, 
  Text, 
  Flex, 
  HStack, 
  Button, 
  Badge, 
  IconButton,
  Spinner,
  useColorModeValue,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Tooltip,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels
} from '@chakra-ui/react';
import { 
  FaBell, 
  FaCalendarCheck, 
  FaPencilAlt,
  FaCalendarTimes,
  FaCheckCircle,
  FaEllipsisV,
  FaTrash
} from 'react-icons/fa';

const Notifications = () => {
  const { 
    notifications, 
    loading, 
    error, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [tabIndex, setTabIndex] = useState(0);
  const perPage = 20;
  
  const navigate = useNavigate();

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const unreadBg = useColorModeValue('blue.50', 'blue.900');
  const iconColor = useColorModeValue('gray.300', 'gray.600');

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications(currentPage, perPage);
  }, [fetchNotifications, currentPage, perPage]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getFilteredNotifications = () => {
    // all, unread, read based on tab index
    if (tabIndex === 0) return notifications;
    if (tabIndex === 1) return notifications.filter(n => !n.read);
    if (tabIndex === 2) return notifications.filter(n => n.read);
    return notifications;
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'success': return 'Success';
      case 'warning': return 'Warning';
      case 'error': return 'Error';
      default: return 'Info';
    }
  };

  const getEntityLabel = (entityType) => {
    switch(entityType) {
      case 'course': return 'Course';
      case 'teacher': return 'Teacher';
      case 'student': return 'Student';
      case 'class': return 'Kindergarten Class';
      case 'school': return 'School';
      case 'region': return 'Region';
      case 'branch': return 'Branch';
      case 'session': return 'Session';
      default: return entityType;
    }
  };

  const getActionLabel = (action) => {
    switch(action) {
      case 'create': return 'Created';
      case 'update': return 'Updated';
      case 'delete': return 'Deleted';
      case 'cancel': return 'Canceled';
      case 'ending_soon': return 'Ending Soon';
      default: return action;
    }
  };
  
  const getActionIcon = (action) => {
    switch(action) {
      case 'create': return <FaCalendarCheck size={14} />;
      case 'update': return <FaPencilAlt size={14} />;
      case 'delete': 
      case 'cancel': return <FaCalendarTimes size={14} />;
      case 'ending_soon': 
      default: return <FaBell size={14} />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'success': return 'green';
      case 'warning': return 'orange';
      case 'error': return 'red';
      default: return 'blue';
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading fontSize="xl" fontWeight="semibold">Notifications</Heading>
        {notifications.length > 0 && (
          <Button 
            size="sm"
            colorScheme="blue"
            variant="outline"
            leftIcon={<FaCheckCircle />}
            onClick={markAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </Flex>

      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg={bgColor}
        borderColor={borderColor}
        boxShadow="sm"
        mb={6}
      >
        <Tabs onChange={(index) => setTabIndex(index)} colorScheme="blue">
          <TabList px={4} bg={headerBg}>
            <Tab>All</Tab>
            <Tab>Unread</Tab>
            <Tab>Read</Tab>
          </TabList>

          <TabPanels>
            {[0, 1, 2].map((tabId) => (
              <TabPanel key={tabId} p={0}>
                {loading ? (
                  <Flex justify="center" align="center" py={10}>
                    <Spinner color="blue.500" size="lg" />
                    <Text ml={3} color="gray.500">Loading notifications...</Text>
                  </Flex>
                ) : error ? (
                  <Box p={6} textAlign="center">
                    <Text color="red.500">{error}</Text>
                  </Box>
                ) : getFilteredNotifications().length === 0 ? (
                  <Box p={10} textAlign="center">
                    <FaBell size={30} color={iconColor} style={{ margin: '0 auto 16px' }} />
                    <Text color="gray.500">No notifications found</Text>
                  </Box>
                ) : (
                  <VStack spacing={0} divider={<Divider />} align="stretch">
                    {getFilteredNotifications().map((notification) => (
                      <Flex 
                        key={notification._id}
                        p={4}
                        bg={!notification.read ? unreadBg : bgColor}
                        _hover={{ bg: hoverBg }}
                        cursor="pointer"
                        onClick={() => handleNotificationClick(notification)}
                        position="relative"
                      >
                        <Box 
                          w="4px" 
                          position="absolute"
                          left={0}
                          top={0}
                          bottom={0}
                          bg={`${getTypeColor(notification.type)}.500`}
                        />
                        
                        <Box flex={1} pl={2}>
                          <Flex justify="space-between" mb={1}>
                            <Box>
                              <Badge 
                                colorScheme={getTypeColor(notification.type)}
                                mr={2}
                              >
                                {getTypeLabel(notification.type)}
                              </Badge>
                              <Badge 
                                colorScheme="gray" 
                                variant="subtle"
                              >
                                {getEntityLabel(notification.entityType)}
                              </Badge>
                            </Box>
                            <Text fontSize="xs" color="gray.500">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </Text>
                          </Flex>
                          
                          <Text fontWeight={!notification.read ? "medium" : "normal"} mb={2}>
                            {notification.message}
                          </Text>
                          
                          <Flex align="center">
                            <Badge 
                              display="flex" 
                              alignItems="center" 
                              px={2}
                              py={1}
                              borderRadius="full"
                              colorScheme={
                                notification.action === 'create' ? 'green' :
                                notification.action === 'update' ? 'blue' :
                                notification.action === 'delete' || notification.action === 'cancel' ? 'red' :
                                'orange'
                              }
                              variant="subtle"
                            >
                              <Box mr={1}>{getActionIcon(notification.action)}</Box>
                              {getActionLabel(notification.action)}
                            </Badge>
                            
                            <Box ml="auto">
                              <Menu placement="bottom-end">
                                <MenuButton
                                  as={IconButton}
                                  aria-label="Options"
                                  icon={<FaEllipsisV />}
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <MenuList>
                                  {!notification.read && (
                                    <MenuItem
                                      icon={<FaCheckCircle />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification._id);
                                      }}
                                    >
                                      Mark as read
                                    </MenuItem>
                                  )}
                                  <MenuItem
                                    icon={<FaTrash />}
                                    color="red.500"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification._id);
                                    }}
                                  >
                                    Delete
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Box>
                          </Flex>
                        </Box>
                      </Flex>
                    ))}
                  </VStack>
                )}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default Notifications; 