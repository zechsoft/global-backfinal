import React, { useRef, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Divider,
  IconButton,
  useColorModeValue,
  useToast
} from "@chakra-ui/react";
import { FiUser, FiSettings, FiLogOut, FiChevronDown } from "react-icons/fi";
import {ProfileIcon} from "components/Icons/Icons";
import { useHistory } from "react-router-dom";

const ProfileDropdown = () => {
  const history = useHistory();
  const toast = useToast();
  const menuRef = useRef();
  const blueShade = useColorModeValue("#0072ff", "#0072ff");
  const bgDropdown = useColorModeValue("white", "navy.800");
  const textColor = useColorModeValue("gray.700", "white");
  
  // Get user data from localStorage or sessionStorage
  const getUserData = () => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  };
  
  const [userData, setUserData] = useState(getUserData());

  const handleLogout = () => {
    // Clear storage
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    
    // Show toast notification
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    
    // Redirect to login page
    history.push("/auth/signin");
  };

  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={Button}
        variant="ghost"
        rightIcon={<FiChevronDown />}
        _hover={{ bg: "transparent" }}
        color ="#fff"
        p="0px"
      >
        <Flex alignItems="center">
          <ProfileIcon
             
             width="25px"  // Increase size of ProfileIcon
            height="25px"
          
            color="white"
            mr="2"
          />
          <Text 
            display={{ base: "none", md: "flex" }} 
            color="#fff"
            fontWeight="medium"
          >
           {userData?.role === "client" ? "Client 1" : userData?.username || "Profile"}

          </Text>
        </Flex>
      </MenuButton>
      
      <MenuList
        bg={bgDropdown}
        borderColor="transparent"
        borderRadius="20px"
        boxShadow="lg"
        p="4"
        minW="250px"
        ref={menuRef}
      >
        <Flex direction="column" p="2">
          <Text fontWeight="bold" fontSize="lg" mb="1">
            User Profile
          </Text>
          <Text color="gray.500" fontSize="sm" mb="3">
            {userData?.email || "mail@example.com"}
          </Text>
          
          <Flex bg="blue.50" p="3" borderRadius="lg" mb="3">
            <Flex
              bg={blueShade}
              color="white"
              borderRadius="md"
              w="10"
              h="10"
              align="center"
              justify="center"
              mr="3"
            >
              <FiUser size={18} />
            </Flex>
            <Box>
              <Text fontWeight="bold" fontSize="sm">
                {userData?.role === "admin" ? "Administrator" : "Client"}
              </Text>
              <Text color="gray.500" fontSize="xs">
                {userData?.role === "admin" ? "Full Access" : "Limited Access"}
              </Text>
            </Box>
          </Flex>
        </Flex>
        
        <Divider mb="3" />
        
        <MenuItem 
          icon={<FiUser color={blueShade} />}
          _hover={{ bg: "blue.50" }}
          borderRadius="md"
          mb="1"
        >
          My Profile
        </MenuItem>
        
        <MenuItem 
          icon={<FiSettings color={blueShade} />}
          _hover={{ bg: "blue.50" }}
          borderRadius="md"
          mb="1"
        >
          Account Settings
        </MenuItem>
        
        <Divider my="3" />
        
        <MenuItem
          icon={<FiLogOut color={blueShade} />}
          _hover={{ bg: "blue.50" }}
          borderRadius="md"
          onClick={handleLogout}
        >
          <Text color={blueShade} fontWeight="medium">Log Out</Text>
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default ProfileDropdown;