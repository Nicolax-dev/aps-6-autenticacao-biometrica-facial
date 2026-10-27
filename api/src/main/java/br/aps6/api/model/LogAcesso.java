package br.aps6.api.model;

import java.time.LocalDateTime;

import br.aps6.api.exception.CodigoErro;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "log_acesso")
public class LogAcesso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "data_hora", insertable = false, updatable = false)
    private LocalDateTime dataHora;

    @Column(name = "sucesso")
    private Boolean sucesso;

    @Column(name = "nivel_acesso")
    private Short nivelAcesso;

    @Column(name = "motivo_falha")
    private String motivoFalha;

    @Column(name = "encoding_confianca")
    private Double encodingConfianca;

    protected LogAcesso() {
    }

    private LogAcesso(Usuario usuario, boolean sucesso, CodigoErro motivoFalha, Double encodingConfianca) {
        this.usuario = usuario;
        this.nivelAcesso = usuario == null ? null : usuario.getCargo().getNivelAcesso();
        this.sucesso = sucesso;
        this.motivoFalha = motivoFalha == null ? null : motivoFalha.name();
        this.encodingConfianca = encodingConfianca;
    }

    public static LogAcesso sucesso(Usuario usuario, double confianca) {
        return new LogAcesso(usuario, true, null, confianca);
    }

    public static LogAcesso falha(Usuario usuario, CodigoErro motivo) {
        return new LogAcesso(usuario, false, motivo, null);
    }

    public Integer getId() {
        return id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public Boolean getSucesso() {
        return sucesso;
    }

    public Short getNivelAcesso() {
        return nivelAcesso;
    }

    public String getMotivoFalha() {
        return motivoFalha;
    }

    public Double getEncodingConfianca() {
        return encodingConfianca;
    }
}