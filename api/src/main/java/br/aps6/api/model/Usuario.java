package br.aps6.api.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Validações (tamanho, regex do email, BCrypt com 60 caracteres...) ficam nos CHECKs do SQL.
 */
@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "nome")
    private String nome;

    @Column(name = "email")
    private String email;

    @Column(name = "senha_hash")
    private String senhaHash;

    @ManyToOne
    @JoinColumn(name = "cargo_id")
    private Cargo cargo;

    @Column(name = "encoding_facial", columnDefinition = "TEXT")
    private String encodingFacial;

    @Column(name = "data_cadastro", insertable = false, updatable = false)
    private LocalDateTime dataCadastro;

    @Column(name = "ativo", insertable = false, updatable = false)
    private Boolean ativo;

    protected Usuario() {
    }

    public Usuario(String nome, String email, String senhaHash, Cargo cargo, String encodingFacial) {
        this.nome = nome;
        this.email = email;
        this.senhaHash = senhaHash;
        this.cargo = cargo;
        this.encodingFacial = encodingFacial;
    }

    public Integer getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public Cargo getCargo() {
        return cargo;
    }

    public String getEncodingFacial() {
        return encodingFacial;
    }

    public LocalDateTime getDataCadastro() {
        return dataCadastro;
    }

    public Boolean getAtivo() {
        return ativo;
    }
}