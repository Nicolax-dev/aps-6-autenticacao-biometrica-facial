package br.aps6.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.aps6.api.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    boolean existsByEmail(String email);

    Optional<Usuario> findByEmail(String email);
}