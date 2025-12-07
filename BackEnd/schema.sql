CREATE DATABASE IF NOT EXISTS tupperware_db;
USE tupperware_db;

-- 1. Consultoras
CREATE TABLE IF NOT EXISTS consultoras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefone VARCHAR(20) NOT NULL,
    cidade VARCHAR(100),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Rifas
CREATE TABLE IF NOT EXISTS rifas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_premio VARCHAR(150) NOT NULL,
    valor_numero DECIMAL(10, 2) NOT NULL,
    total_numeros INT NOT NULL,
    status ENUM('Aberta', 'Encerrada', 'Sorteada') DEFAULT 'Aberta',
    imagem_url VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Mentoria
CREATE TABLE IF NOT EXISTS mentoria_leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    nivel VARCHAR(50),
    dificuldade TEXT,
    data_interesse TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Clientes (PARA LOGIN)
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    senha VARCHAR(255) NOT NULL, -- Em produção, use hash!
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Números da Rifa
CREATE TABLE IF NOT EXISTS rifa_numeros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rifa_id INT NOT NULL,
    numero INT NOT NULL,
    cliente_id INT,
    comprador_nome VARCHAR(100) NOT NULL,
    comprador_telefone VARCHAR(20) NOT NULL,
    status ENUM('Reservado', 'Pago') DEFAULT 'Reservado',
    id_pagamento_externo VARCHAR(100),
    data_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rifa_id) REFERENCES rifas(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);