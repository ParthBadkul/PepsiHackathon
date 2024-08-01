import React from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import "./Navbar.css";

const NavigationBar: React.FC = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="#home">PepsiCo</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="m-auto">
            <Navbar.Text className="dpa-flash">DPA Flash</Navbar.Text>
          </Nav>
          <Nav className="ml-auto">
            <Button variant="outline-light">Sign In</Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
