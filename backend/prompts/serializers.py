from rest_framework import serializers
from .models import Prompt, PromptVersion, TestRun
from accounts.serializers import UserSerializer


class PromptVersionSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = PromptVersion
        fields = ['id', 'version_number', 'content', 'created_by', 'created_at']
        read_only_fields = ['id', 'version_number', 'created_at']


class PromptSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    current_version = serializers.SerializerMethodField()
    
    class Meta:
        model = Prompt
        fields = ['id', 'title', 'description', 'content', 'created_by', 'created_at', 'updated_at', 'is_archived', 'current_version']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_current_version(self, obj):
        latest = obj.versions.first()
        return latest.version_number if latest else 0
    
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['tenant'] = user.tenant
        validated_data['created_by'] = user
        prompt = Prompt.objects.create(**validated_data)
        PromptVersion.objects.create(
            prompt=prompt,
            content=prompt.content,
            version_number=1,
            created_by=user
        )
        return prompt
    
    def update(self, instance, validated_data):
        if 'content' in validated_data and validated_data['content'] != instance.content:
            user = self.context['request'].user
            latest_version = instance.versions.first()
            new_version_number = (latest_version.version_number + 1) if latest_version else 1
            PromptVersion.objects.create(
                prompt=instance,
                content=validated_data['content'],
                version_number=new_version_number,
                created_by=user
            )
        return super().update(instance, validated_data)


class TestRunSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = TestRun
        fields = ['id', 'prompt', 'version', 'provider', 'model', 'input_variables', 'response', 'tokens_used', 'cost', 'latency_ms', 'created_by', 'created_at']
        read_only_fields = ['id', 'created_at']
