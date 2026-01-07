-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 22-11-2025 a las 00:54:02
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sistema_transito`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `infracciones`
--

CREATE TABLE `infracciones` (
  `id` int(11) NOT NULL,
  `numero_acta` varchar(50) NOT NULL,
  `vehiculo_id` int(11) NOT NULL,
  `conductor_dni` varchar(20) DEFAULT NULL,
  `conductor_nombre` varchar(100) DEFAULT NULL,
  `motivo` text NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `fecha_infraccion` datetime NOT NULL,
  `lugar_infraccion` varchar(200) DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado` enum('activa','resuelta','anulada') DEFAULT 'activa',
  `observaciones` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `infracciones`
--

INSERT INTO `infracciones` (`id`, `numero_acta`, `vehiculo_id`, `conductor_dni`, `conductor_nombre`, `motivo`, `usuario_id`, `fecha_infraccion`, `lugar_infraccion`, `fecha_registro`, `estado`, `observaciones`) VALUES
(1, '1', 4, '47346990', 'Rodrigo', 'es un gil', 3, '2025-11-06 09:43:00', 'tavela', '2025-11-06 00:43:44', 'resuelta', ''),
(2, '2', 1, '12345678', 'Mosilla', 'se falopeo', 3, '2025-11-01 00:43:00', 'tavela', '2025-11-06 00:44:28', '', ''),
(3, '3', 1, '1234564432', 'Colon', 'afdafsafsa', 3, '2025-11-21 23:20:00', 'tavela', '2025-11-21 23:21:13', 'activa', 'ssdsa');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventario_partes`
--

CREATE TABLE `inventario_partes` (
  `id` int(11) NOT NULL,
  `infraccion_id` int(11) NOT NULL,
  `parte_vehiculo` varchar(100) NOT NULL,
  `estado` enum('bueno','danado','ausente','irregular') DEFAULT 'bueno',
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `propietarios`
--

CREATE TABLE `propietarios` (
  `id` int(11) NOT NULL,
  `dni` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `carnet_conducir` varchar(50) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `propietarios`
--

INSERT INTO `propietarios` (`id`, `dni`, `nombre`, `carnet_conducir`, `direccion`, `telefono`, `email`, `fecha_nacimiento`, `fecha_registro`) VALUES
(1, '47346990', 'Maximiliano Plaza', '12345', 'Esteban Echeverría, 244', '03872521161', 'plazamaxi385@gmail.com', '2006-09-07', '2025-11-06 00:40:34'),
(2, '12345678', 'Pepe', '987654', 'siempreviva', '3874385382', NULL, '2025-11-05', '2025-11-06 00:41:34');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','usuario','invitado') NOT NULL DEFAULT 'usuario',
  `nombre_completo` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultimo_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `username`, `password`, `rol`, `nombre_completo`, `email`, `activo`, `fecha_creacion`, `ultimo_login`) VALUES
(3, 'admin', '$2a$10$0KVOjlaeOhsp8Uoryv/3reArzls636S..BLCPIpB9KDxA65F84JBW', 'admin', 'Administrador Principal', 'admin@transito.gov', 1, '2025-09-30 14:18:03', '2025-11-21 23:51:38');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vehiculos`
--

CREATE TABLE `vehiculos` (
  `id` int(11) NOT NULL,
  `patente` varchar(15) NOT NULL,
  `tipo_vehiculo` enum('auto','camion','moto','bicicleta','otro') NOT NULL,
  `marca` varchar(50) DEFAULT NULL,
  `modelo` varchar(50) DEFAULT NULL,
  `color` varchar(30) DEFAULT NULL,
  `numero_motor` varchar(100) DEFAULT NULL,
  `numero_chasis` varchar(100) DEFAULT NULL,
  `propietario_id` int(11) DEFAULT NULL,
  `cedula_verde` varchar(100) DEFAULT NULL,
  `titulo_registro` varchar(100) DEFAULT NULL,
  `seguro_activo` tinyint(1) DEFAULT 0,
  `compañia_seguro` varchar(100) DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `vehiculos`
--

INSERT INTO `vehiculos` (`id`, `patente`, `tipo_vehiculo`, `marca`, `modelo`, `color`, `numero_motor`, `numero_chasis`, `propietario_id`, `cedula_verde`, `titulo_registro`, `seguro_activo`, `compañia_seguro`, `fecha_registro`) VALUES
(1, 'ABC123', 'auto', 'Toyota', 'Corolla', 'Rojo', 'MOT123456', 'CHS789012', 2, NULL, NULL, 0, NULL, '2025-09-30 14:39:04'),
(4, 'AZBSFS', 'auto', 'Ford', 'Fiesta 2006', 'Naranja', '432515', '41245124', 1, '241254', '2424', 0, 'Pepegrillo', '2025-10-09 13:33:26');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `infracciones`
--
ALTER TABLE `infracciones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_acta` (`numero_acta`),
  ADD KEY `vehiculo_id` (`vehiculo_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `inventario_partes`
--
ALTER TABLE `inventario_partes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `infraccion_id` (`infraccion_id`);

--
-- Indices de la tabla `propietarios`
--
ALTER TABLE `propietarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dni` (`dni`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indices de la tabla `vehiculos`
--
ALTER TABLE `vehiculos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `patente` (`patente`),
  ADD KEY `propietario_id` (`propietario_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `infracciones`
--
ALTER TABLE `infracciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `inventario_partes`
--
ALTER TABLE `inventario_partes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `propietarios`
--
ALTER TABLE `propietarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `vehiculos`
--
ALTER TABLE `vehiculos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `infracciones`
--
ALTER TABLE `infracciones`
  ADD CONSTRAINT `infracciones_ibfk_1` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`),
  ADD CONSTRAINT `infracciones_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `inventario_partes`
--
ALTER TABLE `inventario_partes`
  ADD CONSTRAINT `inventario_partes_ibfk_1` FOREIGN KEY (`infraccion_id`) REFERENCES `infracciones` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `vehiculos`
--
ALTER TABLE `vehiculos`
  ADD CONSTRAINT `vehiculos_ibfk_1` FOREIGN KEY (`propietario_id`) REFERENCES `propietarios` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
