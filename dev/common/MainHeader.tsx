import { faChevronDown as arrowIcon, faCogs as cogsIcon, faRightFromBracket as logoutIcon } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useToggle } from '@shlinkio/shlink-frontend-kit';
import { clsx } from 'clsx';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Collapse, Nav, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink } from 'reactstrap';
import { ShlinkLogo } from './img/ShlinkLogo';
import './MainHeader.scss';
import { ThemeToggle } from '../ThemeToggle';
import { fetchEmail } from '../helper/fetchEmail';


export type MainHeaderDeps = {
	ServersDropdown: FC;
};

export const MainHeader: FC = () => {
	const [isNotCollapsed, toggleCollapse, , collapse] = useToggle();
	const location = useLocation();
	const { pathname } = location;
	const [email, setEmail] = useState<string | null>(null);

	// In mobile devices, collapse the navbar when location changes
	useEffect(collapse, [location, collapse]);

	// Fetch email from /oauth2/userinfo
	useEffect(() => {
		fetchEmail().then((data) => setEmail(data));
	}, []);

	const settingsPath = '/settings';
	const toggleClass = clsx('main-header__toggle-icon', { 'main-header__toggle-icon--opened': isNotCollapsed });

	// Final OAuth2 Proxy sign out URL  
	const signOutUrl = `/oauth2/sign_out`;

	const signOut = () => {
		window.location.href = signOutUrl;
	};

	return (
		<Navbar color="primary" dark fixed="top" className="main-header" expand="md">
			<NavbarBrand tag={Link} to="/">
				<ShlinkLogo className="main-header__brand-logo" color="white" /> Shlink
			</NavbarBrand>
			<NavbarToggler onClick={toggleCollapse}>
				<FontAwesomeIcon icon={arrowIcon} className={toggleClass} />
			</NavbarToggler>
			<Collapse navbar isOpen={isNotCollapsed}>
				<Nav navbar className="ms-auto">
					{email && (
						<NavItem className="me-3 d-flex align-items-center justify-content-center">
							<span className="navbar-text text-white">{email}</span>
						</NavItem>
					)}
					<NavItem>
						<NavLink tag={Link} to={settingsPath} active={pathname.startsWith(settingsPath)}>
							<FontAwesomeIcon icon={cogsIcon} />&nbsp; Settings
						</NavLink>
					</NavItem>
					<NavItem className="d-flex align-items-center justify-content-center">
						<ThemeToggle />
					</NavItem>
					<NavItem>
						<NavLink href="#" onClick={signOut}>
							<FontAwesomeIcon icon={logoutIcon} />&nbsp; Sign Out
						</NavLink>
					</NavItem>
				</Nav>
			</Collapse>
		</Navbar>
	);
};