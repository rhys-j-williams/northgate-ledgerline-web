{{- define "ldg.name" -}}
{{- .Chart.Name -}}
{{- end -}}

{{- define "ldg.labels" -}}
app.kubernetes.io/name: {{ include "ldg.name" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: meridian-business
meridian.bank/team: treasury-digital
{{- end -}}
