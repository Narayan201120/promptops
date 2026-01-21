# Generated manually to enable pgvector extension

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('prompts', '0002_add_embedding_models'),
    ]

    operations = [
        migrations.RunSQL(
            "CREATE EXTENSION IF NOT EXISTS vector;",
            reverse_sql="DROP EXTENSION IF EXISTS vector;"
        ),
    ]