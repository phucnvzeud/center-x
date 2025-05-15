import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Flex,
  Text,
  Input,
  Select,
  IconButton,
  HStack,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';
import { FaSort, FaSortUp, FaSortDown, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

/**
 * Enhanced DataTable for displaying tabular data with sorting, filtering, and pagination
 */
const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  totalItems = 0,
  itemsPerPage = 10,
  currentPage = 1,
  onPageChange,
  onSort,
  sortField,
  sortDirection,
  onSearch,
  searchTerm = '',
  onFilter,
  filterOptions = [],
  selectedFilter = '',
  emptyMessage = 'No data found',
  variant = 'default',
  ...props
}) => {
  const thBg = useColorModeValue('gray.50', 'gray.700');
  const thColor = useColorModeValue('gray.600', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Get container class based on variant
  const getContainerClass = () => {
    if (variant === 'glass') return 'glass-card';
    return '';
  };
  
  return (
    <Box className={getContainerClass()} overflow="hidden" borderRadius="lg" {...props}>
      {/* Table Header with search and filter */}
      {(onSearch || onFilter || filterOptions.length > 0) && (
        <Flex 
          p={4} 
          bg={useColorModeValue('white', 'gray.800')} 
          borderBottomWidth="1px" 
          borderColor={borderColor}
          justify="space-between"
          align="center"
          flexWrap="wrap"
        >
          {/* Search field */}
          {onSearch && (
            <Box mb={{ base: 2, md: 0 }} w={{ base: '100%', md: 'auto' }}>
              <Flex align="center">
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => onSearch(e.target.value)}
                  size="md"
                  variant="filled"
                  maxW="300px"
                  borderRadius="md"
                />
                <IconButton
                  icon={<FaSearch />}
                  ml={2}
                  aria-label="Search"
                  variant="ghost"
                />
              </Flex>
            </Box>
          )}
          
          {/* Filter dropdown */}
          {onFilter && filterOptions.length > 0 && (
            <Box>
              <Select
                placeholder="Filter by..."
                value={selectedFilter}
                onChange={(e) => onFilter(e.target.value)}
                size="md"
                variant="filled"
                maxW="200px"
                borderRadius="md"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Box>
          )}
        </Flex>
      )}
      
      {/* Table */}
      <Box overflowX="auto">
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              {columns.map((column) => (
                <Th
                  key={column.key}
                  bg={thBg}
                  color={thColor}
                  py={4}
                  position="relative"
                  cursor={column.sortable ? 'pointer' : 'default'}
                  onClick={() => column.sortable && onSort && onSort(column.key)}
                >
                  <Flex align="center">
                    <Text>{column.label}</Text>
                    {column.sortable && onSort && (
                      <Box ml={1}>
                        {sortField === column.key ? (
                          sortDirection === 'asc' ? (
                            <FaSortUp />
                          ) : (
                            <FaSortDown />
                          )
                        ) : (
                          <FaSort opacity={0.3} />
                        )}
                      </Box>
                    )}
                  </Flex>
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={columns.length} textAlign="center" py={10}>
                  <Flex justify="center" align="center" direction="column">
                    <Spinner size="lg" color="brand.500" mb={4} />
                    <Text>Loading data...</Text>
                  </Flex>
                </Td>
              </Tr>
            ) : data.length === 0 ? (
              <Tr>
                <Td colSpan={columns.length} textAlign="center" py={10}>
                  <Text color="gray.500">{emptyMessage}</Text>
                </Td>
              </Tr>
            ) : (
              data.map((row, rowIndex) => (
                <Tr 
                  key={row.id || rowIndex}
                  _hover={{ bg: hoverBg }}
                  transition="background-color 0.2s"
                  data-aos="fade-up"
                  data-aos-delay={rowIndex * 50}
                  data-aos-once="true"
                >
                  {columns.map((column) => (
                    <Td key={`${row.id || rowIndex}-${column.key}`}>
                      {column.render ? column.render(row) : row[column.key]}
                    </Td>
                  ))}
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>
      
      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <Flex 
          p={4} 
          bg={useColorModeValue('white', 'gray.800')} 
          borderTopWidth="1px" 
          borderColor={borderColor}
          justify="space-between"
          align="center"
        >
          <Text fontSize="sm" color="gray.500">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
          </Text>
          
          <HStack spacing={2}>
            <IconButton
              icon={<FaChevronLeft />}
              aria-label="Previous page"
              onClick={() => onPageChange(currentPage - 1)}
              isDisabled={currentPage === 1}
              size="sm"
              variant="ghost"
            />
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
              let pageNumber;
              
              // Logic to show current page in the middle when possible
              if (totalPages <= 5) {
                pageNumber = index + 1;
              } else if (currentPage <= 3) {
                pageNumber = index + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + index;
              } else {
                pageNumber = currentPage - 2 + index;
              }
              
              return (
                <IconButton
                  key={pageNumber}
                  aria-label={`Page ${pageNumber}`}
                  onClick={() => onPageChange(pageNumber)}
                  colorScheme={currentPage === pageNumber ? 'brand' : 'gray'}
                  variant={currentPage === pageNumber ? 'solid' : 'ghost'}
                  size="sm"
                >
                  {pageNumber}
                </IconButton>
              );
            })}
            
            <IconButton
              icon={<FaChevronRight />}
              aria-label="Next page"
              onClick={() => onPageChange(currentPage + 1)}
              isDisabled={currentPage === totalPages}
              size="sm"
              variant="ghost"
            />
          </HStack>
        </Flex>
      )}
    </Box>
  );
};

export default DataTable; 